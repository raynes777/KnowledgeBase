package node.visitor;


import java.util.List;
import java.util.stream.Collectors;
import content.Content;
import node.DocumentNode;
import node.RootNode;

public class ContentListVisitor implements NodeVisitor<List<Content<?>>>{
	

	@Override
	public List<Content<?>> visitDocumentNode(DocumentNode n) {
		return n.accept(Flattener.get()).map(i -> i.content()).collect(Collectors.toList());
	}

	@Override
	public List<Content<?>> visitRootNode(RootNode n) {
		return List.of();
	}
	
	
	public static ContentListVisitor get() {
		return new ContentListVisitor();
	}

	

}
