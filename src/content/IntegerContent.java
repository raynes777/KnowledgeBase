package content;



import java.util.List;
import java.util.Optional;

import content.visitor.ContentVisitor;



public class IntegerContent extends Content<Integer> {
	


	
	IntegerContent(Integer i, Author a){
		super.setContent(i);
		super.setLinks(List.of());
		super.setVersion(Optional.empty());
	}
	
	@Override
	public <R> void link(Content<R> c) {
		Link<IntegerContent, Content<R>> newLink = Link.getNewLink(this, c);
		
		this.addLink(newLink);
		
		c.addLink(newLink);
		
	}
	
	public static IntegerContent getNewContent(Integer i, Author a) {
		return new IntegerContent(i, a);
	}

	@Override
	public <W> W accept(ContentVisitor<W> contentVisitor) {
		return contentVisitor.visitIntegerContent(this);
	}



}
