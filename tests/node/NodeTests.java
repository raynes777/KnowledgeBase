package node;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.Before;
import org.junit.Test;

import content.Author;
import content.Content;
import content.StringContent;

public class NodeTests {
	
	private StringContent.builder contentBuilder = StringContent.builder.get() ;
	private DocumentNode.builder nodeBuilder = DocumentNode.builder.get();
	private Node fatherNode;
	private Node firstChild;
	private Node secondChild;
	
	

	@Before
	public void setup() {
		
		Author gabibbo = Author.getNewAuthor("Il Gabibbo");
		
		Content<String> DocumentTitle = contentBuilder.withAuthor(gabibbo).withContent("Libro del gabibbo").build();
		
		this.fatherNode = nodeBuilder.withContent(DocumentTitle).build();
		
		Content<String> firstChildContent = contentBuilder.withAuthor(gabibbo).withContent("Primo capitolo libro del gabibbo").build();
		
		this.firstChild = nodeBuilder.withContent(firstChildContent).withParent(fatherNode).build();
		
		Content<String> secondChildContent = contentBuilder.withAuthor(gabibbo).withContent("Secondo capitolo libro del gabibbo").build();
		
		this.secondChild = nodeBuilder.withContent(secondChildContent).withParent(fatherNode).build();
	}
	
	
	@Test
	public void structureTest() {
		
		assertThat(fatherNode.children()).contains(firstChild, secondChild);
		assertThat(firstChild.parent()).isEqualTo(fatherNode);
		assertThat(secondChild.parent()).isEqualTo(fatherNode);
		
	}
	
	@Test
	public void rootNodeTests() {
		assertThat(RootNode.getInstance().parent()).isEqualTo(RootNode.getInstance());
		assertThat(RootNode.getInstance().children().contains(fatherNode));
		assertThat(RootNode.getInstance().content().show()).isEqualTo("It's considered rude to look inside the root node.");
	}
	
	
	
}
